select * from issues;
select * from users;
select * from status;
select * from common_code;

insert into issues (issue_code) values (100);

commit;

SELECT
      project_code,
      project_name
    FROM projects
    ORDER BY project_code;